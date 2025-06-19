namespace MetaLink.Domain.Entities
{
    public class QuizAnswer
    {
        public int QuizAnswerID { get; set; }
        public int QuizID { get; set; }       
        public int StudentID { get; set; }
        public int QuestionID { get; set; }
        public int SelectedOptionID { get; set; }
    }
}
