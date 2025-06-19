namespace MetaLink.Domain.Entities
{
    public class CompanyProfile
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Mission { get; set; }
        public string Vision { get; set; }
        public string WhoWeAre { get; set; }

        public string CoreValues { get; set; }         // JSON string
        public string ContactInfo { get; set; }        // JSON string
        public string TeamMembers { get; set; }        // JSON string
        public string WhatWeDo { get; set; }           // JSON string
        public string DifferenceItems { get; set; }    // JSON string
    }
}
