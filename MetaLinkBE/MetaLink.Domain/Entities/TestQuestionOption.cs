using System.ComponentModel.DataAnnotations;

namespace MetaLink.Domain.Entities
{
    public class TestQuestionOption
    {
        [Key]
        public int OptionID { get; set; }
        public int QuestionID { get; set; }
        public string OptionText { get; set; }
        public bool IsCorrect { get; set; }
    }
}
