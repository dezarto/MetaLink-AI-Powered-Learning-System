namespace MetaLink.Domain.Entities
{
    public class LearningStyleAnswer
    {
        public int ID { get; set; }
        public int StudentID { get; set; }
        public int LearningStyleQuestionID { get; set; }
        public bool? Answer { get; set; }
    }
}
