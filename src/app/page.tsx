import { Navbar } from "@/components/layout";
import { Hero } from "@/components/layout/Hero";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Mail,
  Search,
} from "lucide-react";

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered research assistant follows a structured workflow to
              deliver personalized investment insights.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 rounded-full p-4 mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                1. Specify Preferences
              </h3>
              <p className="text-gray-600">
                Tell our AI about your investment goals, risk tolerance, and
                preferences for sectors, regions, or dividend yields.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 rounded-full p-4 mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. AI Research</h3>
              <p className="text-gray-600">
                Our LangGraph workflow searches for relevant data, analyzes
                market trends, and identifies matching investment opportunities.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 rounded-full p-4 mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Review Report</h3>
              <p className="text-gray-600">
                Receive a comprehensive investment report with tables of
                ETFs/stocks matching your criteria and detailed analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Investment Reports Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">User Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">AI-Powered Research</div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Form Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-1 p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Start Your Dividend Research
                </h2>
                <p className="text-gray-600 mb-6">
                  Enter your investment preferences below to receive
                  personalized dividend stock and ETF recommendations.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Sector
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>All Sectors</option>
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Financial Services</option>
                      <option>Consumer Goods</option>
                      <option>Energy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Global</option>
                      <option>North America</option>
                      <option>Europe</option>
                      <option>Asia Pacific</option>
                      <option>Emerging Markets</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Yield (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      defaultValue="3"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>3%</span>
                      <span>10%</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <a
                      href="/dashboard"
                      className="inline-flex items-center justify-center w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate Research Report
                      <ArrowUpRight className="ml-2 w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="md:flex-1 bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    What You'll Receive
                  </h3>
                  <ul className="space-y-4 text-left">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Personalized dividend stock recommendations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Historical yield performance analysis</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Risk assessment and volatility metrics</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Downloadable report with visualizations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Email delivery with future updates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 grid gap-8 text-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="font-bold text-lg mb-2">AI Agents Company</div>
            <div className="text-gray-500">
              © 2025 AI Agents Company. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
