namespace Metalink.Application.DTOs
{
    public class ExamAnswerDTO
    {
        public int QuestionId { get; set; }
        public string SelectedOption { get; set; } = string.Empty; // "A", "B", "C", "D"
    }
}
