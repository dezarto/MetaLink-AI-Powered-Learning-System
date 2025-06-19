using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IReviewSessionRepository
    {
        Task<ReviewSession> GetByIdAsync(int id);
        Task<IEnumerable<ReviewSession>> GetByStudentIdAsync(int studentId);
        Task AddAsync(ReviewSession session);
        Task UpdateAsync(ReviewSession session);
        Task DeleteAsync(int id);
    }
}
