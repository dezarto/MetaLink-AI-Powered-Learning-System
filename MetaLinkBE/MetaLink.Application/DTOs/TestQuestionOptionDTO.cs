namespace MetaLink.Application.DTOs
{
    public class TestQuestionOptionDTO
    {
        public int OptionID { get; set; }
        public int QuestionID { get; set; }
        public string OptionText { get; set; }
        public bool IsCorrect { get; set; }
    }
}
