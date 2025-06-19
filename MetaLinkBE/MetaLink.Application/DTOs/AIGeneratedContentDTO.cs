using MetaLink.Domain.Enums;

namespace MetaLink.Application.DTOs
{
    public class AIGeneratedContentDTO
    {
        public int ContentID { get; set; }
        public int PromptID { get; set; }
        public int SubLessonID { get; set; }
        public int StudentID { get; set; }
        public ContentTypeEnum ContentType { get; set; }
        public string GeneratedText { get; set; }
        public string? GeneratedImage1 { get; set; }
        public string? GeneratedImage2 { get; set; }
        public string? GeneratedImage3 { get; set; }
        public int ImageStatus { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
