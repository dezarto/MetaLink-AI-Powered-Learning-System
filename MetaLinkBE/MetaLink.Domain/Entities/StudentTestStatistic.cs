using MetaLink.Domain.Enums;

namespace MetaLink.Domain.Entities
{
    public class StudentTestStatistic
    {
        public int ID { get; set; }
        public int StudentID { get; set; }
        public int? TestID { get; set; }
        public int? QuizID { get; set; }
        public TestTypeEnum? TestType { get; set; }
        public QuizTypeEnum? QuizType { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public int DurationInMilliseconds { get; set; }
        public DateTime TestDate { get; set; }
    }
}
