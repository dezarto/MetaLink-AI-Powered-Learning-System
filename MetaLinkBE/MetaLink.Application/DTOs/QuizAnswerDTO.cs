namespace MetaLink.Application.DTOs
{
    public class QuizAnswerDTO
    {
        public int QuizAnswerID { get; set; }
        public int StudentID { get; set; }
        public int QuestionID { get; set; }
        public int SelectedOptionID { get; set; }
    }
}
