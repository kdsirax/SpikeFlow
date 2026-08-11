-- CreateTable
CREATE TABLE "ExecutionHistory" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "runtimeChosen" TEXT NOT NULL,
    "decisionReason" TEXT,
    "cpuUsage" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "cacheHit" BOOLEAN NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExecutionHistory" ADD CONSTRAINT "ExecutionHistory_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
