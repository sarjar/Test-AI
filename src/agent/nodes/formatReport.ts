import { WorkflowState, SummaryReport } from '../types';

const formatReportNode = async ({ state }: { state: WorkflowState }) => {
  try {
    console.log('formatReportNode input:', state);
    if (!state.summary) {
      console.error('No summary to format');
      return { ...state, status: "error", error: "No summary to format" };
    }

    console.log('Formatting report from summary:', state.summary);
    const topPicks = state.summary.topPicks || [];
    const sectors = [...new Set(topPicks.map(etf => etf.sector).filter(Boolean))];
    const regions = [...new Set(topPicks.map(etf => etf.region).filter(Boolean))];
    const yields = topPicks.map(etf => etf.dividendYield).filter(y => y != null && !isNaN(y)) as number[];

    // Calculate metadata
    const averageYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;
    const topSectors = sectors.slice(0, 3); // Top 3 sectors by frequency
    const dataQuality = topPicks.length >= 5 ? 'high' : topPicks.length >= 2 ? 'medium' : 'low';

    let summary = "";
    if (topPicks.length === 0) {
      summary = "We couldn't find any dividend ETFs matching your specific criteria from our real-time data sources. This could be due to very specific requirements or temporary data availability. We recommend:\n\n";
      summary += "• Expanding your yield range to include more options\n";
      summary += "• Including additional sectors or regions in your search\n";
      summary += "• Trying again later as market data updates throughout the day\n\n";
      summary += "Our system only provides real-time market data to ensure you get the most current information available.";
    } else {
      const best = topPicks[0];
      const bestYield = best.dividendYield?.toFixed(2) || "N/A";
      const avgYieldFormatted = averageYield.toFixed(2);
      
      summary += `📊 **Real-Time Market Analysis Complete!**\n\n`;
      summary += `Our AI found ${topPicks.length} dividend ETF${topPicks.length > 1 ? 's' : ''} from live market data that match your criteria. `;
      summary += `The top performer is **${best.name || "N/A"}**${best.symbol ? ` (${best.symbol})` : ""}, with a current yield of **${bestYield}%**. `;
      
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
      
      summary += `\n\n✅ **Investment Benefits:** Each ETF was selected based on real-time market data to help you generate consistent dividend income while maintaining portfolio diversification. `;
      
      // Add data quality and real-time notes
      if (dataQuality === 'low') {
        summary += `\n\n⚠️ **Limited Results:** We found fewer options than usual. Consider broadening your search criteria for more real-time opportunities. `;
      }
      
      summary += `\n\n🔄 **Live Data:** All information is sourced from current market data. For different results, adjust your preferences above and we'll scan the markets again!`;
    }

    console.log('Generated report summary:', summary);
    
    const report: SummaryReport = {
      title: state.summary?.title || "Real-Time Dividend ETF Analysis",
      summary,
      topPicks: topPicks,
      timestamp: new Date().toISOString(),
      metadata: {
        totalETFsAnalyzed: state.scrapedData?.length || 0,
        averageYield: Number(averageYield.toFixed(2)),
        topSectors,
        dataQuality
      }
    };

    return {
      ...state,
      report,
      status: "complete",
    };
  } catch (error) {
    console.error('Error in formatReportNode:', error);
    return {
      ...state,
      status: "error",
      error: error instanceof Error && error.message ? error.message : "Unknown error in formatReportNode"
    };
  }
};

export default formatReportNode;
