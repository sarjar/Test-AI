import { WorkflowState, SummaryReport } from "../types";

/**
 * Format Report Node
 *
 * Creates final formatted report with metadata and recommendations
 * Generates user-friendly summary with investment insights
 */

const formatReportNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    if (!state.summary) {
      return { ...state, status: "error", error: "No summary to format" };
    }
    const topPicks = state.summary.topPicks || [];
    const etfCount = topPicks.filter((inv) => inv.type === "ETF").length;
    const stockCount = topPicks.filter((inv) => inv.type === "STOCK").length;
    const sectors = [
      ...new Set(
        topPicks.map((investment) => investment.sector).filter(Boolean),
      ),
    ];
    const regions = [
      ...new Set(
        topPicks.map((investment) => investment.region).filter(Boolean),
      ),
    ];
    const yields = topPicks
      .map((investment) => investment.dividendYield)
      .filter((y) => y != null && !isNaN(y)) as number[];

    // Calculate metadata
    const averageYield =
      yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;
    const topSectors = sectors.slice(0, 3); // Top 3 sectors by frequency
    const dataQuality =
      topPicks.length >= 5 ? "high" : topPicks.length >= 2 ? "medium" : "low";

    let summary = "";
    if (topPicks.length === 0) {
      summary = "🔍 **No Investments Found Matching Your Criteria**\n\n";
      summary +=
        "We searched our financial data sources but couldn't find investments that match your specific requirements. This could be due to:\n\n";
      summary +=
        "• **Very specific criteria**: Your yield range or sector/region combination might be too narrow\n";
      summary +=
        "• **Market conditions**: Current market yields may not align with your target range\n";
      summary +=
        "• **Data source limitations**: Some sources may be temporarily unavailable\n\n";
      summary += "💡 **Suggestions to Find More Options:**\n";
      summary +=
        "• **Broaden yield range**: Try 1-10% instead of a narrow range\n";
      summary +=
        "• **Expand sectors**: Include 'All' sectors or add more sector options\n";
      summary +=
        "• **Include both ETFs and stocks**: Select both investment types\n";
      summary +=
        "• **Include global markets**: Add 'Global' or 'International' regions\n";
      summary += "• **Try again**: Market data refreshes regularly\n\n";
      summary += "🎯 **Popular Dividend Investment Ranges:**\n";
      summary += "• High-yield dividend investments: 3-6% yield\n";
      summary += "• Balanced dividend investments: 2-4% yield\n";
      summary += "• Growth + dividend investments: 1-3% yield";
    } else {
      const best = topPicks[0];
      const bestYield = best.dividendYield?.toFixed(2) || "N/A";
      const avgYieldFormatted = averageYield.toFixed(2);

      summary += `📊 **Real-Time Market Analysis Complete!**\n\n`;
      summary += `Our AI found ${topPicks.length} dividend investment${topPicks.length > 1 ? "s" : ""} from live market data that match your criteria`;
      if (etfCount > 0 && stockCount > 0) {
        summary += ` (${etfCount} ETF${etfCount > 1 ? "s" : ""} and ${stockCount} stock${stockCount > 1 ? "s" : ""})`;
      } else if (etfCount > 0) {
        summary += ` (all ETFs)`;
      } else if (stockCount > 0) {
        summary += ` (all stocks)`;
      }
      summary += `. The top performer is **${best.name || "N/A"}**${best.symbol ? ` (${best.symbol})` : ""}, ${best.type === "ETF" ? "an ETF" : "a stock"} with a current yield of **${bestYield}%**. `;

      if (yields.length > 1) {
        summary += `\n\n💰 **Yield Analysis:** Your picks have an average yield of ${avgYieldFormatted}%, ranging from ${Math.min(...yields).toFixed(2)}% to ${Math.max(...yields).toFixed(2)}%. `;
      }

      if (sectors.length > 1) {
        summary += `\n\n🏭 **Sector Diversification:** Your portfolio spans ${sectors.slice(0, -1).join(", ")}${sectors.length > 2 ? "," : ""} and ${sectors.slice(-1)} sectors. `;
      } else if (sectors.length === 1) {
        summary += `\n\n🏭 **Sector Focus:** All picks are concentrated in the ${sectors[0]} sector. `;
      }

      if (regions.length > 1) {
        summary += `\n\n🌍 **Geographic Coverage:** These ETFs provide exposure to ${regions.slice(0, -1).join(", ")}${regions.length > 2 ? "," : ""} and ${regions.slice(-1)} markets. `;
      } else if (regions.length === 1) {
        summary += `\n\n🌍 **Regional Focus:** All selections target the ${regions[0]} market. `;
      }

      summary += `\n\n✅ **Investment Benefits:** Each investment was selected based on real-time market data to help you generate consistent dividend income while maintaining portfolio diversification. ${etfCount > 0 && stockCount > 0 ? "The mix of ETFs and individual stocks provides both diversification and targeted exposure." : etfCount > 0 ? "ETFs provide instant diversification across multiple holdings." : "Individual stocks offer targeted exposure to specific companies."} `;

      // Add data quality and real-time notes
      if (dataQuality === "low") {
        summary += `\n\n⚠️ **Limited Results:** We found fewer options than usual. Consider broadening your search criteria for more real-time opportunities. `;
      }

      summary += `\n\n🔄 **Live Data:** All information is sourced from current market data. For different results, adjust your preferences above and we'll scan the markets again!`;
    }

    const report: SummaryReport = {
      title: state.summary?.title || "Real-Time Dividend Investment Analysis",
      summary,
      topPicks: topPicks,
      timestamp: new Date().toISOString(),
      metadata: {
        totalInvestmentsAnalyzed: state.scrapedData?.length || 0,
        averageYield: Number(averageYield.toFixed(2)),
        topSectors,
        dataQuality,
        etfCount:
          state.scrapedData?.filter((inv) => inv.type === "ETF").length || 0,
        stockCount:
          state.scrapedData?.filter((inv) => inv.type === "STOCK").length || 0,
      },
    };

    return {
      ...state,
      report,
      status: "complete",
    };
  } catch (error) {
    return {
      ...state,
      status: "error",
      error:
        error instanceof Error && error.message
          ? error.message
          : "Unknown error in formatReportNode",
    };
  }
};

export default formatReportNode;
