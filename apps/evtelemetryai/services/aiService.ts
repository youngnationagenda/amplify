import { DailySummary, RiderProfile, RideData } from '../types';

export interface RealtimeMetrics {
  // ... keep existing interface
}

export const generateRealtimeMetrics = async (rides: RideData[]): Promise<RealtimeMetrics | null> => {
  // ... keep existing function
};

/**
 * Perform a deep audit of the fleet's performance and carbon credits.
 * Calls AWS Lambda /api/analyze endpoint for secure AI analysis.
 */
export const analyzeFleetPerformance = async (
    summaries: DailySummary[],
    riders: RiderProfile[],
    dateRange?: { start: string; end: string }
): Promise<string> => {
    
    try {
        // Get Lambda API endpoint from environment or use default
        const apiEndpoint = import.meta.env.VITE_LAMBDA_API_ENDPOINT 
            || 'https://{api-id}.execute-api.us-east-1.amazonaws.com/prod';
        
        const response = await fetch(`${apiEndpoint}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                summaries,
                riders,
                dateRange
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        return result.analysis || "Analysis complete but no text returned.";

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return `Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`;
    }
};
