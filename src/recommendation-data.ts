interface ActivityRecommendations {
    [key: string]: string;
  }
  
  const recommendationData: Map<string, ActivityRecommendations> = new Map();
  recommendationData.set("SRM subprocess", {
    "Allocate Resource": "Resource unavailable for SRM: Awaiting Approval",
    "Contact Client": "late delivery"
  });
  
  export function getRecommendationData(): Map<string, ActivityRecommendations> {
    return recommendationData;
  }
  
  export function getActivityRecommendationData(activityName: string): ActivityRecommendations | undefined {
    return recommendationData.get(activityName);
  }