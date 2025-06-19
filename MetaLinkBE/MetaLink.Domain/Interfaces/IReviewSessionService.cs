using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IReviewSessionService
    {
        Task<ReviewSession> GetReviewSessionByIdAsync(int id);
        Task<IEnumerable<ReviewSession>> GetReviewSessionByStudentIdAsync(int studentId);
        Task AddReviewSessionAsync(ReviewSession session);
        Task UpdateReviewSessionAsync(ReviewSession session);
        Task DeleteReviewSessionAsync(int id);
    }
}
