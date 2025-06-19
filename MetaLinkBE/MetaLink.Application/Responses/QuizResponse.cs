using MetaLink.Domain.Enums;

namespace MetaLink.Application.Responses
{
    public class QuizResponse
    {
        public int QuizID { get; set; }
        public int? SubLessonID { get; set; }
        public int? LessonID { get; set; }
        public int StudentId { get; set; }
        public QuizTypeEnum QuizType { get; set; }
        public int DurationInMilliseconds { get; set; }
        public bool IsSolved { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime CreateDate { get; set; }

        // Limit veya hata durumları için durum kodu
        public int? Status { get; set; }

        public List<QuizQuestionResponse> QuizQuestions { get; set; }
    }

    public class QuizQuestionResponse
    {
        public int QuestionID { get; set; }
        public int QuizID { get; set; }
        public string QuestionText { get; set; }
        public List<QuizQuestionOptionResponse> QuizQuestionOptions { get; set; }
    }

    public class QuizQuestionOptionResponse
    {
        public int OptionID { get; set; }
        public int QuestionID { get; set; }
        public string OptionText { get; set; }
        public bool IsCorrect { get; set; }
        public bool? isSelected { get; set; }  // Kullanıcı cevaplarını göstermek için
    }

    public class RawQuizResponse
    {
        public RawQuiz Quiz { get; set; }
    }

    public class RawQuiz
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public List<RawQuizQuestionResponse> QuizQuestions { get; set; }
    }

    public class RawQuizQuestionResponse
    {
        public string QuestionText { get; set; }
        public List<RawQuizQuestionOptionResponse> QuizQuestionOptions { get; set; }
    }

    public class RawQuizQuestionOptionResponse
    {
        public string OptionText { get; set; }
        public bool IsCorrect { get; set; }
    }
}
