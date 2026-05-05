import { companyLogos } from "@/lib/company-logos";

export default function CompanyLogoCarousel() {
  const doubled = [...companyLogos, ...companyLogos];

  return (
    <div className="gs-logos-track" aria-hidden="false">
      <div className="gs-logos-row">
        {doubled.map((company, i) => (
          <div key={`${company.name}-${i}`} className="gs-logos-item">
            <img
              src={company.logo}
              alt={company.name}
              width={48}
              height={28}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
