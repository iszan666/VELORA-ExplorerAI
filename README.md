# Velora Explorer

Velora Explorer is an intelligent travel planning application designed to streamline the complex process of itinerary curation. By leveraging Google's Gemini API, the application functions as a personalized travel architect, generating bespoke day-by-day plans based on specific user preferences such as destination, budget, duration, and travel style.

The application distinguishes itself from standard trip generators by prioritizing visual immersion and cultural context. It dynamically aggregates high-resolution imagery, plots activities on interactive maps, and provides nuanced advice regarding local customs and etiquette, simulating the experience of consulting with a professional human travel advisor.

## Key Features

### AI-Driven Curation
Utilizes advanced generative models to construct logical, time-efficient itineraries. The system accounts for travel logistics, opening hours, and geographic proximity when sequencing activities.

### Partial Itinerary Refinement
Users can request specific modifications to an existing plan (e.g., "replace museums with parks" or "add more vegan dining options"). The application intelligently updates only the relevant sections while preserving the overall structure and flow of the trip.

### Dynamic Visuals & Mapping
- **Contextual Imagery:** Integrates with Unsplash and Pexels APIs to fetch real-world photography for specific locations and activities, ensuring the itinerary is visually accurate.
- **Interactive Maps:** Features a fully interactive map view using Leaflet and OpenStreetMap, allowing users to visualize their daily routes and activity clusters.

### Cultural & Practical Intelligence
Beyond simple scheduling, the application provides:
- **Advisor Rationale:** A "Why This Works For You" section explaining the logic behind the selected destination and pacing.
- **Local Context:** Curated data on local customs, etiquette, and culinary staples.
- **Budget Transparency:** Detailed cost estimates and professional disclaimers regarding budget assumptions.

### Premium User Experience
Built with a "dark mode first" aesthetic, utilizing glassmorphism, fluid animations, and a sophisticated orbital loading state to maintain user engagement during data processing.

## Technical Architecture

**Frontend Core**
- React 18
- TypeScript
- Tailwind CSS (Container Queries, Custom Animations)

**Artificial Intelligence**
- Google Gemini API (`gemini-3-flash-preview` and `gemini-3-pro`) for reasoning and JSON structure generation.

**Data & Integrations**
- **Mapping:** Leaflet.js, OpenStreetMap, Nominatim (Geocoding).
- **Imagery:** Unsplash API, Pexels API, Wikipedia API (fallback).

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A Google Gemini API Key
- (Optional) Unsplash and Pexels API keys for full visual functionality

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/velora-explorer.git
   cd velora-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory (or configure your environment accordingly):
   ```env
   # Required
   API_KEY=your_google_gemini_api_key

   # Optional (Recommended for visual experience)
   UNSPLASH_ACCESS_KEY=your_unsplash_key
   PEXELS_API_KEY=your_pexels_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Project Status

This project is currently developed for educational and portfolio purposes. It serves as a demonstration of integrating Large Language Models (LLMs) into consumer-facing applications with a focus on structured JSON output, state management, and refined UI/UX design.