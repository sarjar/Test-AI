# High Dividend AI - Investment Research Assistant

An AI-powered investment research platform that provides real-time market analysis and personalized investment recommendations, focusing on dividend ETFs and individual dividend-paying stocks.

### Core Functionality
- **Real-time Market Data**: Integration with Alpha Vantage API for live market information
- **Investment Research**: Comprehensive analysis of dividend ETFs and individual stocks
- **AI Consultant Chat**: Interactive chatbot for investment advice and market insights
- **Personalized Recommendations**: Customizable preferences based on sectors, regions, and yield ranges



## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Next.js API routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: OpenAI GPT-4, LangChain, LangGraph
- **Containerization**: Docker, Docker Compose
- **Real-time Data**: Alpha Vantage API
- **Authentication**: Supabase Auth

## Architecture Overview



### Database Schema
- `users` - User profiles and preferences
- `chat_history` - Chat conversation history

- `agent_interactions` - Research request tracking
- `rate_limits` - API usage tracking

## Local Development Setup

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (recommended)
- Supabase account and project
- OpenAI API key
- Alpha Vantage API key (optional)
- Financial Dataset API key (optional)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd high-dividend-ai
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys (see Environment Variables section below)

3. **Run with Docker Compose**
   ```bash
   # Development mode (with hot reload)
   docker-compose up --build
   
   # Or run in background
   docker-compose up -d --build
   ```

4. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - The app will automatically reload when you make changes

5. **Stop the application**
   ```bash
   docker-compose down
   ```

### Manual Setup (Alternative)

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd high-dividend-ai
   npm install
   ```

2. **Set up environment variables** (see below)

3. **Run development server**
   ```bash
   npm run dev
   ```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_PROJECT_ID=your_supabase_project_id

# Required - OpenAI
OPENAI_API_KEY=your_openai_api_key

# Optional - Financial Data APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
FINANCIAL_DATASET_API_KEY=your_financial_dataset_api_key

# Development (Optional)
NEXT_TELEMETRY_DISABLED=1
```

### Supabase Setup

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from Settings > API

2. **Run database migrations**
   ```bash
   # If you have Supabase CLI installed
   supabase db push
   
   # Or manually run the SQL files in supabase/migrations/ in your Supabase dashboard
   ```

3. **Configure authentication**
   - Enable email authentication in Supabase dashboard
   - Set up any additional auth providers if needed

## Usage

### Basic Investment Research
1. Navigate to the Research tab
2. Set your preferences (sectors, regions, yield range)
3. Generate a personalized investment report

### AI Consultant Chat
1. Go to the Chat tab
2. Ask questions about investments, market conditions, or strategies
3. Get real-time, personalized responses



## API Endpoints

- `POST /api/research` - Generate investment research reports
- `POST /api/chat` - AI consultant chat
- `DELETE /api/chat/clear` - Clear chat history

## Key Features

### Enhanced AI Responses
- Context-aware investment advice and market analysis
- Detailed financial analysis based on real-time market data
- Intelligent follow-up suggestions
- Professional financial consultation tone

## Development Commands

```bash
# Start development server (Docker)
docker-compose up --build

# Start development server (local)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

### Production Docker Build
```bash
# Build and run production version
docker-compose -f docker-compose.prod.yml up --build

# Or build production image directly
docker build -f Dockerfile.prod -t high-dividend-ai-prod .
docker run -p 3000:3000 --env-file .env.local high-dividend-ai-prod
```

### Vercel (Recommended for production)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker Environment Setup
Ensure your `.env.local` file contains all required environment variables before running Docker commands.

## Troubleshooting

### Common Issues

**Docker Issues**
- If you get permission errors, try running Docker commands with `sudo`
- Make sure Docker Desktop is running
- Clear Docker cache: `docker system prune -a`

**Port Already in Use**
- If port 3000 is busy, change it in docker-compose.yml: `"3001:3000"`
- Or stop the process using port 3000: `lsof -ti:3000 | xargs kill -9`

**Environment Variables**
- Make sure `.env.local` exists and has all required variables
- Don't commit `.env.local` to git (it's in .gitignore)
- Restart the container after changing environment variables

**API Rate Limits**
- Monitor OpenAI API usage
- Check Alpha Vantage rate limits (5 calls/minute free tier)
- Implement proper error handling for rate limit scenarios

**Supabase Connection**
- Verify all Supabase environment variables are set
- Check database migrations are applied
- Ensure RLS policies are configured correctly

**Hot Reload Not Working**
- Make sure you're using the development Docker setup
- Check that volumes are properly mounted in docker-compose.yml

### Development Tips

- Use `docker-compose logs -f` to see real-time logs
- Enable debug logging by setting `NODE_ENV=development`
- Monitor API responses and error handling
- Use `docker-compose exec app sh` to access the container shell

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information

---

**Note**: This application is for educational and research purposes. Always consult with qualified financial advisors before making investment decisions.
