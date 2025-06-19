namespace MetaLink.Application.Responses
{
    public class EducationContentResponse
    {
        public int ContentId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? GeneratedImage1 { get; set; }
        public string? GeneratedImage2 { get; set; }
        public string? GeneratedImage3 { get; set; }
        public string AudioUrl { get; set; }
    }
}
