using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class ReviewSessionService : IReviewSessionService
    {
        private readonly IReviewSessionRepository _reviewSessionRepository;

        public ReviewSessionService(IReviewSessionRepository reviewSessionRepository)
        {
            _reviewSessionRepository = reviewSessionRepository;
        }

        public async Task AddReviewSessionAsync(ReviewSession session)
        {
            await _reviewSessionRepository.AddAsync(session);
        }

        public async Task DeleteReviewSessionAsync(int id)
        {
            await _reviewSessionRepository.DeleteAsync(id);
        }

        public async Task<ReviewSession> GetReviewSessionByIdAsync(int id)
        {
            return await _reviewSessionRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<ReviewSession>> GetReviewSessionByStudentIdAsync(int studentId)
        {
            return await _reviewSessionRepository.GetByStudentIdAsync(studentId);
        }

        public async Task UpdateReviewSessionAsync(ReviewSession session)
        {
            await _reviewSessionRepository.UpdateAsync(session);
        }
    }
}
