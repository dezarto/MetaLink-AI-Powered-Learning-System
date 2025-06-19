using System.ComponentModel.DataAnnotations;

namespace MetaLink.Domain.Entities
{
    public class QuizQuestion
    {
        [Key]
        public int QuestionID { get; set; }
        public int QuizID { get; set; }
        public string QuestionText { get; set; }
    }
}
