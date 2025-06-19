using System.Collections.Generic;

namespace Metalink.Application.DTOs
{
    public class ExamQuestionDTO
    {
        public int Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string LearningStyleType { get; set; } = string.Empty; // "auditory", "verbal", "visual"
        public List<ExamOptionDTO> Options { get; set; } = new List<ExamOptionDTO>();
        public string CorrectOption { get; set; } = string.Empty; // Örneğin "A"

        // Medya bilgileri
        public string? MediaUrl { get; set; }
        public string? MediaType { get; set; }
    }
}
