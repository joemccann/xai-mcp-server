import type { Reporter, File, Task } from "vitest";
import Table from "cli-table3";

export default class TableReporter implements Reporter {
  private showDetails = process.env.VITEST_DETAILED === "true";
  private testCount = 0;

  onInit() {
    console.log("\n🚀 Starting integration tests...\n");
  }

  onTaskUpdate(tasks: Task[]) {
    tasks.forEach((task) => {
      if (task.type === "test" && task.result?.state === "pass") {
        this.testCount++;
        process.stdout.write(`\r✓ ${this.testCount} tests passed...`);
      }
    });
  }

  onFinished(files: File[] = []) {
    // Clear progress line and add spacing
    console.log("\n");
    
    // Main results table
    const table = new Table({
      head: ["Test File", "Tests", "Passed", "Failed", "Skipped", "Duration"],
      style: {
        head: ["cyan", "bold"],
        border: ["gray"],
      },
    });

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    files.forEach((file) => {
      const stats = this.getFileStats(file);
      totalTests += stats.total;
      totalPassed += stats.passed;
      totalFailed += stats.failed;
      totalSkipped += stats.skipped;
      totalDuration += file.result?.duration || 0;

      const statusColor = stats.failed > 0 ? "\x1b[31m" : "\x1b[32m";
      const resetColor = "\x1b[0m";

      table.push([
        file.filepath.replace(process.cwd(), "."),
        stats.total,
        `${statusColor}${stats.passed}${resetColor}`,
        stats.failed > 0 ? `\x1b[31m${stats.failed}\x1b[0m` : stats.failed,
        stats.skipped,
        `${(file.result?.duration || 0).toFixed(0)}ms`,
      ]);
    });

    console.log("\n" + table.toString());

    // Detailed test breakdown (if enabled)
    if (this.showDetails) {
      files.forEach((file) => {
        this.printDetailedTests(file);
      });
    }

    // Performance breakdown
    this.printPerformanceMetrics(files);

    // Summary table
    const summaryTable = new Table({
      head: ["Summary"],
      style: {
        head: ["cyan", "bold"],
        border: ["gray"],
      },
    });

    const allPassed = totalFailed === 0;
    const statusEmoji = allPassed ? "✓" : "✗";
    const statusColor = allPassed ? "\x1b[32m" : "\x1b[31m";

    summaryTable.push(
      ["Total Tests", totalTests],
      ["Passed", `${statusColor}${totalPassed}\x1b[0m`],
      ["Failed", totalFailed > 0 ? `\x1b[31m${totalFailed}\x1b[0m` : totalFailed],
      ["Skipped", totalSkipped],
      ["Duration", `${totalDuration.toFixed(0)}ms`],
      ["Status", `${statusColor}${statusEmoji} ${allPassed ? "ALL PASSED" : "FAILED"}\x1b[0m`]
    );

    console.log("\n" + summaryTable.toString() + "\n");
  }

  private getFileStats(file: File) {
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    const countTasks = (tasks: Task[]) => {
      tasks.forEach((task) => {
        if (task.type === "test") {
          if (task.result?.state === "pass") passed++;
          else if (task.result?.state === "fail") failed++;
          else if (task.mode === "skip" || task.mode === "todo") skipped++;
        }
        if ("tasks" in task && task.tasks) {
          countTasks(task.tasks);
        }
      });
    };

    countTasks(file.tasks);

    return {
      total: passed + failed + skipped,
      passed,
      failed,
      skipped,
    };
  }

  private printDetailedTests(file: File) {
    const detailTable = new Table({
      head: ["Test Name", "Status", "Duration"],
      style: {
        head: ["cyan"],
        border: ["gray"],
      },
      colWidths: [60, 12, 12],
    });

    console.log(`\n\x1b[1m${file.filepath.replace(process.cwd(), ".")}\x1b[0m`);

    const collectTests = (tasks: Task[], depth = 0) => {
      tasks.forEach((task) => {
        if (task.type === "test") {
          const indent = "  ".repeat(depth);
          const status = task.result?.state === "pass" 
            ? "\x1b[32m✓ PASS\x1b[0m" 
            : task.result?.state === "fail"
            ? "\x1b[31m✗ FAIL\x1b[0m"
            : "⊝ SKIP";
          const duration = task.result?.duration 
            ? `${task.result.duration.toFixed(2)}ms` 
            : "N/A";
          
          detailTable.push([`${indent}${task.name}`, status, duration]);

          if (task.result?.state === "fail" && task.result?.errors) {
            task.result.errors.forEach((error: any) => {
              detailTable.push([`${indent}  ❌ ${error.message}`, "", ""]);
            });
          }
        }
        if ("tasks" in task && task.tasks) {
          if (task.type === "suite") {
            const indent = "  ".repeat(depth);
            detailTable.push([`${indent}\x1b[1m${task.name}\x1b[0m`, "", ""]);
          }
          collectTests(task.tasks, depth + 1);
        }
      });
    };

    collectTests(file.tasks);
    console.log(detailTable.toString());
  }

  private printPerformanceMetrics(files: File[]) {
    const perfTable = new Table({
      head: ["Performance Metrics"],
      style: {
        head: ["cyan", "bold"],
        border: ["gray"],
      },
    });

    const totalDuration = files.reduce((sum, f) => sum + (f.result?.duration || 0), 0);
    const avgDuration = totalDuration / files.length;
    
    // Sort files by duration to find slowest
    const sortedFiles = [...files].sort((a, b) => 
      (b.result?.duration || 0) - (a.result?.duration || 0)
    );

    perfTable.push(
      ["Average Test File Duration", `${avgDuration.toFixed(2)}ms`],
      ["Slowest Test File", `${sortedFiles[0]?.filepath.replace(process.cwd(), ".")} (${(sortedFiles[0]?.result?.duration || 0).toFixed(0)}ms)`],
      ["Fastest Test File", `${sortedFiles[sortedFiles.length - 1]?.filepath.replace(process.cwd(), ".")} (${(sortedFiles[sortedFiles.length - 1]?.result?.duration || 0).toFixed(0)}ms)`],
    );

    console.log("\n" + perfTable.toString());
  }
}
