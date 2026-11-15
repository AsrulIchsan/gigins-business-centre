import { PrismaClient, StockTransactionType } from "@prisma/client";

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  expiredDate: Date;
  qtyDeducted: number;
  buyPrice: number;
  subtotalCost: number;
}

export interface FIFODeductionResult {
  success: boolean;
  message?: string;
  allocations: BatchAllocation[];
  totalDeducted: number;
  totalCostPrice: number; // Total HPP
  weightedAvgCost: number; // HPP per unit
}

/**
 * Core FIFO Inventory Allocation and Deduction Engine
 * 
 * Rules:
 * 1. Always deduct from the batch with the EARLIEST Expired Date (FEFO / FIFO Kedaluwarsa).
 * 2. If a batch does not have enough stock, consume it completely and move to the next batch.
 * 3. Calculate accurate HPP (Cost of Goods Sold) based on the exact buyPrice of each batch.
 * 4. Record stock card mutations for audit trail.
 */
export async function allocateStockFIFO(
  tx: any, // Prisma Transaction client
  productId: string,
  requestedQty: number
): Promise<FIFODeductionResult> {
  // 1. Fetch available batches ordered by expiredDate ascending
  const batches = await tx.productBatch.findMany({
    where: {
      productId: productId,
      quantity: { gt: 0 },
    },
    orderBy: [
      { expiredDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  const totalAvailable = batches.reduce(
    (sum: number, b: any) => sum + Number(b.quantity),
    0
  );

  if (totalAvailable < requestedQty) {
    return {
      success: false,
      message: `Stok tidak mencukupi! Diminta: ${requestedQty}, Tersedia di seluruh batch: ${totalAvailable}`,
      allocations: [],
      totalDeducted: 0,
      totalCostPrice: 0,
      weightedAvgCost: 0,
    };
  }

  let remainingToDeduct = requestedQty;
  const allocations: BatchAllocation[] = [];
  let totalCostPrice = 0;

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;

    const batchQty = Number(batch.quantity);
    const deductFromThisBatch = Math.min(batchQty, remainingToDeduct);
    const batchCost = Number(batch.buyPrice);

    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiredDate: batch.expiredDate,
      qtyDeducted: deductFromThisBatch,
      buyPrice: batchCost,
      subtotalCost: deductFromThisBatch * batchCost,
    });

    totalCostPrice += deductFromThisBatch * batchCost;
    remainingToDeduct -= deductFromThisBatch;
  }

  const weightedAvgCost = requestedQty > 0 ? totalCostPrice / requestedQty : 0;

  return {
    success: true,
    allocations,
    totalDeducted: requestedQty,
    totalCostPrice,
    weightedAvgCost,
  };
}

/**
 * Execute FIFO deduction: updates batch records and inserts stock card entries
 */
export async function executeFIFODeduction(
  tx: any,
  productId: string,
  allocations: BatchAllocation[],
  transactionType: StockTransactionType,
  transactionRef: string,
  unitId: string,
  userId: string,
  notes?: string
) {
  for (const alloc of allocations) {
    // 1. Get current batch balance before deduction
    const currentBatch = await tx.productBatch.findUnique({
      where: { id: alloc.batchId },
    });

    if (!currentBatch) {
      throw new Error(`Batch ID ${alloc.batchId} tidak ditemukan!`);
    }

    const balanceBefore = Number(currentBatch.quantity);
    const balanceAfter = balanceBefore - alloc.qtyDeducted;

    if (balanceAfter < 0) {
      throw new Error(
        `Stok batch ${alloc.batchNumber} tidak mencukupi saat proses finalisasi (Race Condition)!`
      );
    }

    // 2. Update batch quantity
    await tx.productBatch.update({
      where: { id: alloc.batchId },
      data: { quantity: balanceAfter },
    });

    // 3. Create StockCard entry
    await tx.stockCard.create({
      data: {
        productId,
        batchId: alloc.batchId,
        transactionType,
        transactionRef,
        quantityIn: 0,
        quantityOut: alloc.qtyDeducted,
        balanceBefore,
        balanceAfter,
        unitId,
        notes: notes || `FIFO Out: Batch ${alloc.batchNumber}`,
        createdById: userId,
      },
    });
  }
}
