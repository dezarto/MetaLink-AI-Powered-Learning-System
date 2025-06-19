namespace Metalink.Domain.Entities
{
    public class ResultsLearningStylesExam
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int TotalQuestions { get; set; }
        public int TrueAnswers { get; set; }
        public int FalseAnswers { get; set; }
        public int VisualCorrect { get; set; }
        public int VisualWrong { get; set; }
        public int VerbalCorrect { get; set; }
        public int VerbalWrong { get; set; }
        public int AuditoryCorrect { get; set; }
        public int AuditoryWrong { get; set; }
        public string DeterminedStyle { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
