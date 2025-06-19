using System.ComponentModel.DataAnnotations;

namespace MetaLink.Domain.Entities
{
    public class TestQuestion
    {
        [Key]
        public int QuestionID { get; set; }
        public int TestID { get; set; }
        public string QuestionText { get; set; }
    }
}
