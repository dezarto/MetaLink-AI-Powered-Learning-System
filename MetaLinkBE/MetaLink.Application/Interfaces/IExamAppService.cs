using MetaLink.Application.Requests;
using MetaLink.Application.Responses;

namespace Metalink.Application.Interfaces
{
    public interface IExamAppService
    {
        Task<List<TestResponse>> GetAllTest(int studentId);
        Task<TestResponse> GetTestByIdAsync(int testId, int studentId);
        Task<TestResponse> GenerateTest(GenerateTest generateTest);
        Task<bool> SaveTestResult(TestResponse testResponse, int studentId);

        Task<List<QuizResponse>> GetAllQuizzes(int studentId);
        Task<QuizResponse> GetQuizByIdAsync(int quizId, int studentId);
        Task<bool> SaveQuizResult(QuizResponse quizResponse, int studentId);

        Task<AskTestAssistantRobotResponse> AskTestAssistantRobot(AskTestAssistantRobotRequest request);
        Task<AskQuizAssistantRobotResponse> AskQuizAssistantRobot(AskQuizAssistantRobotRequest request);
        Task<QuizResponse> GenerateQuiz(GenerateQuiz generateQuiz);
        Task<bool> UpdateProgressAsync(UpdateProgressRequest updateProgressRequest, int studentId);

        Task<IEnumerable<QuizResponse>> GetAllQuizByStudentIdAsync(int studentId);

        Task<TestProcessResponse> GetAllTestProcessByStudentId(int studentId);
        Task<ComparisonResponse> CompareTestAsync(ComparisonRequest request);
        Task<ComparisonResponse> CompareQuizAsync(ComparisonRequest request);
    }
}
