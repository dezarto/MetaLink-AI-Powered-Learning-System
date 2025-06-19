using MetaLink.Domain.Enums;

namespace MetaLink.Domain.Entities
{
    public class Quiz
    {
        public int QuizID { get; set; }
        public int? SubLessonID { get; set; }     
        public int? LessonID { get; set; }       
        public int StudentId { get; set; }        
        public QuizTypeEnum QuizType { get; set; } 
        public bool IsSolved { get; set; }         
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
