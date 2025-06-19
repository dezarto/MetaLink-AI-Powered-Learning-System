namespace MetaLink.Application.Responses
{
    public class LearningStyleResponse
    {
        public bool LearningStyleCompleated { get; set; }
        public List<LearningStyleCategoryResponse>? LearningStyleCategories { get; set; }
    }

    public class LearningStyleCategoryResponse
    {
        public int ID { get; set; }
        public string CategoryName { get; set; }
        public List<LearningStyleQuestionResponse> LearningStyleQuestions { get; set; }
    }

    public class LearningStyleQuestionResponse
    {
        public int ID { get; set; }
        public int LearningStyleCategoryID { get; set; }
        public string QuestionText { get; set; }
    }
}
