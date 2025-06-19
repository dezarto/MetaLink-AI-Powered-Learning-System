namespace MetaLink.Application.DTOs
{
    public class LearningStyleAnswerDTO
    {
        public int ID { get; set; }
        public int StudentID { get; set; }
        public int LearningStyleQuestionID { get; set; }
        public bool? Answer { get; set; }
    }
}
