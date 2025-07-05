// MedSpaSync Pro Marketing Funnel Configuration
// Strategic positioning for independent medical spas

const config = {
    // Core Value Proposition
    hero: {
        title: "Stop the Hidden Profit Killer Destroying Your Medical Spa's Bottom Line",
        subtitle: "Independent medical spas lose $600-$2,000 monthly to inventory waste. MedSpaSync Pro's AI prevents this with 95%+ accuracy and predictive analytics.",
        ctaPrimary: "Calculate Your Savings",
        ctaSecondary: "Start Free Trial",
        ctaPrimaryUrl: "#roi-calculator",
        ctaSecondaryUrl: "https://app.medspasyncpro.com"
    },

    // Market Statistics for Authority Building
    marketStats: {
        independentOwnership: "76-90%",
        marketOpportunity: "$87.86B",
        aiAdoptionCAGR: "47%",
        healthcareWaste: "$250B",
        facialTreatmentDominance: "55%"
    },

    // ROI Calculator Configuration
    roiCalculator: {
        defaultInventoryValue: 15000,
        defaultTransactionVolume: 500,
        defaultLocations: 1,
        wastePercentages: {
            manual: 0.20,    // 20% waste with manual spreadsheets
            basic: 0.15,     // 15% waste with basic POS
            advanced: 0.10   // 10% waste with advanced analytics
        },
        preventionRate: 0.80, // 80% of waste can be prevented
        monthlyPrice: 299
    },

    // Competitive Differentiation
    competitors: {
        zenoti: {
            name: "Zenoti",
            positioning: "While Zenoti offers general AI, we specialize in medical spa predictive analytics",
            advantages: [
                "Medical spa-specific AI",
                "Predictive inventory management", 
                "Independent spa focus"
            ]
        },
        pabau: {
            name: "Pabau", 
            positioning: "Beyond automated notes - we prevent profit loss through predictive inventory",
            advantages: [
                "Profit optimization focus",
                "AI reconciliation",
                "ROI-driven analytics"
            ]
        },
        patientNow: {
            name: "PatientNow",
            positioning: "Patient conversion is just the start - we optimize lifetime value through operations",
            advantages: [
                "Operational efficiency",
                "Inventory optimization", 
                "Predictive growth"
            ]
        }
    },

    // Target Audience Segments
    audienceSegments: {
        independentSpaOwners: {
            primary: true,
            painPoint: "Stop Losing Money to Inventory Waste - Get Enterprise-Level Analytics",
            savings: "$600-$2,000 monthly",
            focus: "Competing against chains, resource limitations, profit optimization"
        },
        multiLocationChains: {
            primary: false,
            painPoint: "Scale Efficiently Across All Locations with Centralized Analytics",
            savings: "15% operational cost reduction",
            focus: "Centralized analytics, location benchmarking, scaling efficiency"
        },
        maleFocusedServices: {
            primary: false,
            painPoint: "Capture the Fastest-Growing Demographic with Predictive Analytics",
            savings: "300% growth opportunity",
            focus: "Brotox demand prediction, male market expansion"
        }
    },

    // SEO Keywords
    seoKeywords: {
        primary: [
            "medical spa inventory management",
            "medical spa analytics", 
            "independent medical spa software"
        ],
        longTail: [
            "reduce medical spa inventory waste",
            "AI reconciliation for spas",
            "medical spa profit optimization"
        ]
    },

    // Call-to-Action URLs
    ctaUrls: {
        freeTrial: "https://app.medspasyncpro.com",
        demo: "https://app.medspasyncpro.com/demo",
        calculator: "#roi-calculator",
        pricing: "https://app.medspasyncpro.com/pricing"
    },

    // Trust Indicators
    trustIndicators: {
        accuracy: "95%+ AI accuracy",
        implementation: "24-hour implementation",
        guarantee: "30-day money-back guarantee",
        support: "24-hour response time"
    },

    // Proven Results
    provenResults: {
        hoursWeeklySaved: 8,
        monthlyRevenueProtected: 2500,
        aiAccuracyRate: 95,
        realUserAccuracy: 97,
        transformationTime: "6 hours weekly to 15 minutes",
        implementationTime: "24 hours"
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} 