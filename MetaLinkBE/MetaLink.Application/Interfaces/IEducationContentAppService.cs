using MetaLink.Application.Requests;
using MetaLink.Application.Responses;

namespace Metalink.Application.Interfaces
{
    public interface IEducationContentAppService
    {
        Task<EducationContentResponse> StudyContentBySubLessonId(EducationContentRequest request);
        Task<EducationContentResponse> StudySummaryBySubLessonId(EducationContentRequest request);
        Task<EducationContentResponse> AskQuestionContentAssistantRobot(EducationContentRequest request);
        Task<EducationContentResponse> GetImageStatus(int contentId);
        Task<List<ReviewSessionResponse>> GetReviewSessionDatas(int studentId, int courseId);
        Task<ReviewSessionResponse> StudyReviewContentAndSummaryBySubLessonId(ReviewSessionRequest request);
        Task<ReviewSessionResponse> GetReviewSessionImageStatus(int reviewSessionId);
    }
}
