import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Beaker,
  Share2,
  TrendingDown,
  BarChart3,
} from "lucide-react";

/**
 * Home Page
 * Landing page with introduction and call-to-action buttons
 */
export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Drug Toxicology QSAR Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Predict toxicity endpoints, analyze molecular properties, and identify
          similar drugs using classical Machine Learning models (Random Forest,
          SVM, XGBoost, LightGBM, KNN).
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/builder")}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition text-lg"
        >
          Start Building Molecules
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <Beaker className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Molecule Builder</h3>
            <p className="text-gray-600 text-sm">
              Draw molecules or enter SMILES strings with structure preview
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <TrendingDown className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Toxicity Prediction</h3>
            <p className="text-gray-600 text-sm">
              Predict toxicity across multiple endpoints using ML models
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <Share2 className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Drug Similarity</h3>
            <p className="text-gray-600 text-sm">
              Find similar drugs from ClinTox and other datasets
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <BarChart3 className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Visualizations</h3>
            <p className="text-gray-600 text-sm">
              Interactive radar charts, bar charts, and scatter plots
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white py-16 mt-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Draw or Input</h3>
              <p className="text-gray-600">
                Build a molecule using the editor or paste a SMILES string
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Analyze</h3>
              <p className="text-gray-600">
                Get toxicity predictions and molecular descriptors instantly
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Explore</h3>
              <p className="text-gray-600">
                Compare with known drugs and view detailed visualizations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
