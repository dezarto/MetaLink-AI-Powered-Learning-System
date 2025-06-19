namespace MetaLink.Domain.Entities
{
    public class TestAnswer
    {
        public int TestAnswerID { get; set; }
        public int StudentID { get; set; }
        public int TestID { get; set; }
        public int QuestionID { get; set; }
        public int SelectedOptionID { get; set; }
    }
}
