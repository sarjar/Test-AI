"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { createClient } from "@/supabase/client";
import ChatInterface from "@/components/etf/ChatInterface";
import ReactMarkdown from "react-markdown";
import { Clock, TrendingUp, AlertCircle } from "lucide-react";
import React from "react";

import {
  INVESTMENT_OPTIONS,
  API_ENDPOINTS,
  UI_MESSAGES,
} from "@/lib/constants";

const {
  TYPES: investmentTypes,
  SECTORS: sectors,
  REGIONS: regions,
} = INVESTMENT_OPTIONS;

export default function ResearchForm() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "ETF",
    "STOCK",
  ]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    "technology",
    "finance",
  ]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([
    "usa",
    "global",
  ]);
  const [yieldRange, setYieldRange] = useState<[number, number]>([2, 8]);
  const [marketCapRange, setMarketCapRange] = useState<[number, number]>([
    1, 500,
  ]);
  const [peRatioMax, setPeRatioMax] = useState<number>(25);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("preferences");
  const [marketStatus, setMarketStatus] = useState<{
    timestamp: string;
    marketStatus: string;
    lastUpdated: string;
  } | null>(null);

  const supabase = createClient();

  // Fetch market status on component mount
  const fetchMarketStatus = async () => {
    try {
      const response = await fetch("/api/market-status");
      if (response.ok) {
        const data = await response.json();
        setMarketStatus(data);
      }
    } catch (error) {
      console.error("Error fetching market status:", error);
    }
  };

  // Fetch market status on mount and set up periodic updates
  React.useEffect(() => {
    fetchMarketStatus();
    const interval = setInterval(fetchMarketStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, typeId]);
    } else {
      setSelectedTypes(selectedTypes.filter((id) => id !== typeId));
    }
  };

  const handleSectorChange = (sectorId: string, checked: boolean) => {
    if (checked) {
      setSelectedSectors([...selectedSectors, sectorId]);
    } else {
      setSelectedSectors(selectedSectors.filter((id) => id !== sectorId));
    }
  };

  const handleRegionChange = (regionId: string, checked: boolean) => {
    if (checked) {
      setSelectedRegions([...selectedRegions, regionId]);
    } else {
      setSelectedRegions(selectedRegions.filter((id) => id !== regionId));
    }
  };

  const handleYieldChange = (value: number[]) => {
    setYieldRange([value[0], value[1]]);
  };

  const handleMarketCapChange = (value: number[]) => {
    setMarketCapRange([value[0], value[1]]);
  };

  const handlePeRatioChange = (value: number[]) => {
    setPeRatioMax(value[0]);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setActiveTab("results");
      setResult({
        userId: "",
        status: "loading",
        currentStep: 1,
        totalSteps: 5,
      });

      // Save preferences to Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("investment_preferences").upsert(
          {
            user_id: user.id,
            investment_types: selectedTypes,
            sectors: selectedSectors.map(
              (id) => sectors.find((s) => s.id === id)?.label || id,
            ),
            regions: selectedRegions.map(
              (id) => regions.find((r) => r.id === id)?.label || id,
            ),
            yield_min: yieldRange[0],
            yield_max: yieldRange[1],
            market_cap_min: marketCapRange[0],
            market_cap_max: marketCapRange[1],
            pe_ratio_max: peRatioMax,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }

      // Call the research API
      const response = await fetch(API_ENDPOINTS.RESEARCH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          investmentTypes: selectedTypes,
          sectors: selectedSectors,
          regions: selectedRegions,
          yieldRange,
          marketCapRange,
          peRatioMax,
        }),
      });

      const data = await response.json();
      console.log("API research result:", data);
      console.log("Workflow result:", data);
      setResult(data);
    } catch (error) {
      console.error("Error submitting research request:", error);
      setResult({
        userId: "",
        error: `Failed to process research request: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: "error",
        currentStep: 0,
        totalSteps: 5,
      });
    } finally {
      setIsLoading(false);
    }
  };

  function capitalizeWords(str: string) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function extractRegionFromName(name: string) {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (lower.includes("usa")) return "USA";
    if (lower.includes("global")) return "Global";
    return null;
  }

  function cleanName(name: string) {
    if (!name) return "";
    return name
      .replace(/\b(usa|global)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function capitalizeSector(str: string) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  const getMarketStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "text-green-600";
      case "After Hours":
        return "text-yellow-600";
      case "Closed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getMarketStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <TrendingUp className="h-4 w-4" />;
      case "After Hours":
        return <Clock className="h-4 w-4" />;
      case "Closed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-6 shadow-md">
      {/* Market Status Banner */}
      {marketStatus && (
        <div className="mb-4 p-3 bg-muted rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1 ${getMarketStatusColor(marketStatus.marketStatus)}`}
              >
                {getMarketStatusIcon(marketStatus.marketStatus)}
                <span className="font-medium">
                  Market Status: {marketStatus.marketStatus}
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Last Updated:{" "}
              {new Date(marketStatus.lastUpdated).toLocaleDateString()}
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Real-time data from Alpha Vantage • Updated:{" "}
            {new Date(marketStatus.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Investment Preferences</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="consultant">AI Consultant</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6 pt-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Investment Types</h3>
            <div className="grid grid-cols-2 gap-3">
              {investmentTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={(checked) =>
                      handleTypeChange(type.id, checked === true)
                    }
                  />
                  <Label htmlFor={`type-${type.id}`}>{type.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Preferred Sectors</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sectors.map((sector) => (
                <div key={sector.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sector-${sector.id}`}
                    checked={selectedSectors.includes(sector.id)}
                    onCheckedChange={(checked) =>
                      handleSectorChange(sector.id, checked === true)
                    }
                  />
                  <Label htmlFor={`sector-${sector.id}`}>{sector.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Preferred Regions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {regions.map((region) => (
                <div key={region.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region.id}`}
                    checked={selectedRegions.includes(region.id)}
                    onCheckedChange={(checked) =>
                      handleRegionChange(region.id, checked === true)
                    }
                  />
                  <Label htmlFor={`region-${region.id}`}>{region.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-medium">Dividend Yield Range</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {UI_MESSAGES.DIVIDEND_YIELD_TOOLTIP}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="px-2">
              <Slider
                defaultValue={[yieldRange[0], yieldRange[1]]}
                max={15}
                min={0}
                step={0.5}
                onValueChange={handleYieldChange}
              />
              <div className="flex justify-between mt-2 text-sm">
                <span>Min: {yieldRange[0]}%</span>
                <span>Max: {yieldRange[1]}%</span>
              </div>
            </div>
          </div>

          {selectedTypes.includes("STOCK") && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-medium">
                    Market Cap Range (Billions)
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {UI_MESSAGES.MARKET_CAP_TOOLTIP}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="px-2">
                  <Slider
                    defaultValue={[marketCapRange[0], marketCapRange[1]]}
                    max={3000}
                    min={0.1}
                    step={0.1}
                    onValueChange={handleMarketCapChange}
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span>Min: ${marketCapRange[0]}B</span>
                    <span>Max: ${marketCapRange[1]}B</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-medium">Maximum P/E Ratio</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {UI_MESSAGES.PE_RATIO_TOOLTIP}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="px-2">
                  <Slider
                    defaultValue={[peRatioMax]}
                    max={50}
                    min={5}
                    step={1}
                    onValueChange={handlePeRatioChange}
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span>Max P/E: {peRatioMax}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={
              isLoading ||
              selectedTypes.length === 0 ||
              selectedSectors.length === 0 ||
              selectedRegions.length === 0
            }
          >
            {isLoading ? "Processing..." : "Generate Research Report"}
          </Button>
        </TabsContent>

        <TabsContent value="results" className="pt-4">
          {/* Show message if no report has been generated yet */}
          {(!result ||
            (!result.report &&
              !result.error &&
              result.status !== "loading")) && (
            <div className="flex flex-col items-center justify-center py-12">
              <Button
                onClick={() => setActiveTab("preferences")}
                className="mb-4"
                variant="default"
              >
                Generate Research Report
              </Button>
              <span className="text-muted-foreground text-center">
                No research report found. Please generate a report by selecting
                your investment preferences.
              </span>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              {result.status === "loading" && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">
                      Generating Your Research Report
                    </h3>
                  </div>
                  <div
                    className="w-full bg-secondary rounded-full h-2.5 relative overflow-hidden"
                    style={{ position: "relative", overflow: "hidden" }}
                  >
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "30%",
                        minWidth: 60,
                        animation: "progressBarLoop 1.2s linear infinite",
                      }}
                    ></div>
                    <style>
                      {`
                        @keyframes progressBarLoop {
                          0% { left: -30%; }
                          100% { left: 100%; }
                        }
                      `}
                    </style>
                  </div>
                </div>
              )}

              {result.status === "error" && (
                <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
                  <h3 className="font-medium mb-2">Error</h3>
                  <p>{result.error || "An unknown error occurred"}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("preferences")}
                  >
                    Back to Preferences
                  </Button>
                </div>
              )}

              {result.status === "success" && result.report && (
                <div className="space-y-6">
                  <div>
                    <ReactMarkdown>{result.report.summary ?? ""}</ReactMarkdown>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">
                      Top Dividend Investment Picks
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left">Investment Name</th>
                            <th className="p-2 text-left">Ticker</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Dividend Yield</th>
                            <th className="p-2 text-left">Sector</th>
                            <th className="p-2 text-left">Region</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.report.topPicks &&
                          result.report.topPicks.length > 0 ? (
                            result.report.topPicks.map(
                              (investment: any, i: number) => {
                                const rawName =
                                  investment.name || investment.title || "N/A";
                                const region =
                                  investment.region &&
                                  investment.region !== "N/A"
                                    ? investment.region
                                    : extractRegionFromName(rawName) || "N/A";
                                const displayName = capitalizeWords(
                                  cleanName(rawName),
                                );
                                const sector = capitalizeSector(
                                  investment.sector || "N/A",
                                );
                                return (
                                  <tr key={i} className="border-b border-muted">
                                    <td className="p-2" title={rawName}>
                                      {displayName}
                                    </td>
                                    <td className="p-2 font-mono">
                                      {investment.symbol ||
                                        investment.ticker ||
                                        "N/A"}
                                    </td>
                                    <td className="p-2">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          investment.type === "ETF"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {investment.type || "N/A"}
                                      </span>
                                    </td>
                                    <td className="p-2 font-medium">
                                      <span
                                        className={
                                          investment.dividendYield > 5
                                            ? "text-green-600"
                                            : ""
                                        }
                                      >
                                        {investment.dividendYield
                                          ? `${investment.dividendYield.toFixed(2)}%`
                                          : "N/A"}
                                      </span>
                                    </td>
                                    <td className="p-2">{sector}</td>
                                    <td className="p-2">{region}</td>
                                  </tr>
                                );
                              },
                            )
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-2 text-center text-muted-foreground"
                              >
                                No picks found. Please try different
                                preferences.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("preferences")}
                    >
                      Adjust Preferences
                    </Button>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm text-muted-foreground">
                        {result.emailResult?.success ? (
                          <span className="text-green-600">
                            ✓ Report sent to your email
                          </span>
                        ) : (
                          <span>Report will be sent to your email shortly</span>
                        )}
                      </div>
                      {marketStatus && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Real-time data • {marketStatus.marketStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consultant" className="pt-4">
          <ChatInterface />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
