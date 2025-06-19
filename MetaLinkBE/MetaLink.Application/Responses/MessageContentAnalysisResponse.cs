namespace MetaLink.Application.Responses
{
    public class MessageContentAnalysisResponse
    {
        public bool HasNegativeContent { get; set; }
        public string Category { get; set; } = "Unknown"; // "Küfür", "Zorbalık", "İntihar", "Nefret Söylemi"
        public int RiskScore { get; set; } // 0 - 100 arasında
    }
}
