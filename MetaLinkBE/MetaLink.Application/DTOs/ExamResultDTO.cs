namespace Metalink.Application.DTOs
{
    public class ExamResultDTO
    {
        public int TotalQuestions { get; set; }
        public int TrueAnswers { get; set; }
        public int FalseAnswers { get; set; }
        public int AuditoryCorrect { get; set; }
        public int AuditoryWrong { get; set; }
        public int VerbalCorrect { get; set; }
        public int VerbalWrong { get; set; }
        public int VisualCorrect { get; set; }
        public int VisualWrong { get; set; }
        public string DeterminedStyle { get; set; } = string.Empty;
    }
}
