# QSAR Platform Frontend

A modern React + TypeScript frontend for the Drug Toxicology QSAR Platform. Provides an interactive interface for molecular structure analysis, toxicity prediction, and drug similarity comparison using classical machine learning models.

## Features

- **Molecule Editor**: Draw or input SMILES strings for molecular compounds
- **Toxicity Prediction**: Interactive visualization of toxicity predictions across multiple endpoints
- **Drug Similarity**: Find similar drugs ranked by Tanimoto coefficient
- **Interactive Charts**: Radar, bar, and comparison visualizations
- **Type-Safe**: Full TypeScript with strict mode enabled
- **Responsive Design**: Mobile-friendly UI with TailwindCSS
- **API Integration**: Axios client with error handling and React Query caching

## Tech Stack

- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3 + PostCSS
- **UI Components**: shadcn/ui, Radix UI, lucide-react icons
- **State Management**: Zustand (global store)
- **Data Fetching**: Axios + React Query (TanStack Query)
- **Charts**: Recharts
- **Routing**: React Router 6

## Prerequisites

- Node.js 18+ or compatible package manager (npm, yarn, pnpm, bun)
- FastAPI backend running (see main project README)
- Git for version control

## Installation

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and update the API URL:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_INDIGO_BASE_URL=/indigo-proxy/v2
INDIGO_PROXY_TARGET=http://localhost:8001
```

For production:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_INDIGO_BASE_URL=/indigo-proxy/v2
INDIGO_PROXY_TARGET=https://indigo.yourdomain.com
```

`VITE_INDIGO_BASE_URL` controls the URL that the browser loads. When you keep it on the relative `/indigo-proxy/v2` path the Vite dev server (and your production reverse proxy) can forward the calls to the actual Indigo container, eliminating CORS failures. Point `INDIGO_PROXY_TARGET` at the true Indigo host. Leave both variables blank to fall back to the built-in WASM struct service.

## Development

### Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Type Checking

```bash
npm run type-check
```

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Indigo 3D Service (Optional)

Ketcher can offload conformer generation and other heavy structure operations to the Indigo Service. This unlocks true 3D structures inside the embedded Miew viewer.

1. **Start the Indigo Service** (Docker):

```bash
docker run --rm -p 8001:80 epmlsop/indigo-service:latest
```

The HTTP API is exposed on port `80` inside the container, so expose it on any host port you like (8001 above). The REST endpoints live under the `/v2/indigo` prefix, so the base URL for the example above is `http://localhost:8001/v2/indigo`. Consult the [Indigo docs](http://lifescience.opensource.epam.com/indigo/service/index.html) for other deployment methods.

2. **Configure the frontend** by pointing the browser at the proxy path and telling the dev server where to forward the requests:

```env
VITE_INDIGO_BASE_URL=/indigo-proxy/v2
INDIGO_PROXY_TARGET=http://localhost:8001
```

3. **Restart** `npm run dev` so Vite reloads the updated environment. In production, serve the built files behind any reverse proxy (FastAPI, Nginx, Traefik, etc.) that forwards `/indigo-proxy/*` to the actual Indigo host specified in `INDIGO_PROXY_TARGET`.

When `VITE_INDIGO_BASE_URL` is set the Molecule Editor switches to the remote Indigo struct service; when it is blank it falls back to the offline WASM engine.

**Verify the hookup:** once the service is running and the variables are set, load a molecule (e.g., “Load Ibuprofen”) and press the `miew` button in the editor toolbar. The 3D window should now display a conformer with depth instead of a flat 2D outline. If you still see a flat structure, re-check the Indigo container logs and ensure the `/indigo-proxy` route actually reaches the service (both `VITE_INDIGO_BASE_URL` and `INDIGO_PROXY_TARGET`).

## Project Structure

```
src/
├── api/                    # API client wrappers
│   ├── client.ts          # Axios configuration
│   ├── qsar.ts            # QSAR prediction endpoints
│   ├── similarity.ts       # Drug similarity endpoints
│   └── features.ts        # Molecular features endpoints
├── components/            # Reusable React components
│   ├── MoleculeEditor.tsx # Molecule input (draw/SMILES)
│   ├── PredictionTable.tsx # Sortable predictions table
│   ├── RadarChart.tsx     # Recharts radar visualization
│   ├── ToxicityBarChart.tsx # Recharts bar chart
│   ├── SimilarityList.tsx # Ranked similar drugs
│   ├── Loading.tsx        # Loading spinner
│   └── ErrorAlert.tsx     # Error notification
├── pages/                 # Page components
│   ├── Home.tsx           # Landing page
│   ├── Builder.tsx        # Molecule builder
│   ├── Analysis.tsx       # Toxicity analysis
│   ├── Similarity.tsx     # Drug similarity
│   └── Visuals.tsx        # Chart dashboard
├── store/                 # Global state (Zustand)
│   └── moleculeStore.ts   # Molecule/prediction store
├── App.tsx                # Root app with routing
├── main.tsx               # React entry point
└── index.css              # Global styles
```

## API Integration

The frontend communicates with the FastAPI backend via these endpoints:

### QSAR Predictions

**POST** `/predict/qsar`

Request:

```json
{
  "smiles": "CC(C)Cc1ccc(cc1)C(C)C(O)=O"
}
```

Response:

```json
{
  "smiles": "CC(C)Cc1ccc(cc1)C(C)C(O)=O",
  "predictions": [
    {
      "endpoint": "hepatotoxicity",
      "prediction": 0.42,
      "confidence": 0.89
    }
  ]
}
```

### Drug Similarity

**POST** `/similarity/drugs`

Request:

```json
{
  "smiles": "CC(C)Cc1ccc(cc1)C(C)C(O)=O",
  "top_n": 10
}
```

Response:

```json
{
  "query_smiles": "CC(C)Cc1ccc(cc1)C(C)C(O)=O",
  "similar_drugs": [
    {
      "name": "Ibuprofen",
      "smiles": "CC(C)Cc1ccc(cc1)C(C)C(O)=O",
      "similarity_score": 1.0,
      "tanimoto_coefficient": 1.0
    }
  ]
}
```

### Molecular Features

**POST** `/descriptors`

Request:

```json
{
  "smiles": "CC(C)Cc1ccc(cc1)C(C)C(O)=O"
}
```

Response:

```json
{
  "smiles": "CC(C)Cc1ccc(cc1)C(C)C(O)=O",
  "features": {
    "molecular_weight": 206.28,
    "logp": 4.51
  }
}
```

## State Management

Global state is managed with Zustand in `src/store/moleculeStore.ts`:

```typescript
// Usage in components
import { useMoleculeStore } from "@/store/moleculeStore";

export const MyComponent = () => {
  const { smiles, setSmiles, predictions, setPredictions } = useMoleculeStore();

  return (
    <div>
      <input value={smiles} onChange={(e) => setSmiles(e.target.value)} />
    </div>
  );
};
```

## Error Handling

The API client includes automatic error handling and retry logic:

```typescript
// Handled automatically by axios interceptor
// - Network errors → Retry once
// - 4xx/5xx responses → Error component display
// - Timeout after 30 seconds
```

## Testing

Run type checking:

```bash
npm run type-check
```

Run linting (if ESLint configured):

```bash
npm run lint
```

## Deployment

### Build for Production

```bash
npm run build
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:

```bash
docker build -t qsar-frontend .
docker run -p 3000:5173 \
  -e VITE_API_URL=http://backend:8000 \
  qsar-frontend
```

### Environment Variables in Production

Set `VITE_API_URL` before building or use a runtime configuration:

```bash
VITE_API_URL=https://api.yourdomain.com npm run build
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Troubleshooting

### API Connection Errors

1. Verify FastAPI backend is running on the specified `VITE_API_URL`
2. Check CORS configuration in FastAPI backend
3. Inspect browser console for detailed error messages

### Module Not Found Errors

Run:

```bash
npm install
npm run type-check
```

### Build Failures

Clear cache and rebuild:

```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

## Contributing

1. Follow TypeScript strict mode
2. Use TailwindCSS for styling (no inline CSS)
3. Add JSDoc comments to components
4. Keep components small and focused
5. Use Zustand for shared state

## License

MIT (see main project LICENSE)

## Support

For issues with the backend API, see the main project README.
