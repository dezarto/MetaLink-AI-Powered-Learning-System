using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class CompanyProfileService : ICompanyProfileService
    {
        private readonly ICompanyProfileRepository _companyProfileRepository;

        public CompanyProfileService(ICompanyProfileRepository companyProfileRepository)
        {
            _companyProfileRepository = companyProfileRepository;
        }

        public async Task<CompanyProfile?> GetCompanyProfileAsync()
        {
            return await _companyProfileRepository.GetAsync();
        }

        public async Task CreateCompanyProfileAsync(CompanyProfile profile)
        {
            await _companyProfileRepository.CreateAsync(profile);
        }

        public async Task UpdateCompanyProfileAsync(CompanyProfile profile)
        {
            await _companyProfileRepository.UpdateAsync(profile);
        }

        public async Task DeleteCompanyProfileAsync(int id)
        {
            await _companyProfileRepository.DeleteAsync(id);
        }
    }
}
