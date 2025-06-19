namespace MetaLink.Application.Requests
{
    public class LearningStyleRequest
    {
        public List<LearningStyleCategoryRequest> LearningStyleCategories { get; set; }
    }

    public class LearningStyleCategoryRequest
    {
        public int ID { get; set; }
        public string CategoryName { get; set; }
        public List<LearningStyleQuestionRequest> LearningStyleQuestions { get; set; }
    }

    public class LearningStyleQuestionRequest
    {
        public int ID { get; set; }
        public int LearningStyleCategoryID { get; set; }
        public string QuestionText { get; set; }
        public bool? Answer { get; set; }
    }
}
