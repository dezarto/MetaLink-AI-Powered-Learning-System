namespace MetaLink.Application.Responses
{
    public class QuizQuestionGameResponse
    {
        public string Text { get; set; }
        public List<string> Answers { get; set; }
        public int CorrectAnswer { get; set; }
    }
}
