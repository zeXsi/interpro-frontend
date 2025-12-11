import './styles.css';
import TitlePage from 'shared/components/TitlePage';
import CompaniesGrid from 'shared/components/CompaniesGrid';
import svgCompanies from 'assets/companies';
import ContactForm from 'shared/components/ContactForm';

export function meta() {
  const title = "Interpro:  наши клиенты и партнеры";
  const description =
    "Познакомьтесь с клиентами Interpro и успешными проектами, которые мы реализовали для различных компаний и отраслей.";

  return [
    { title },

    { name: "description", content: description },

    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
}

export default function Clients() {
  return (
    <div className="Clients px">
      <TitlePage title='Наши клиенты' />
      <CompaniesGrid items={ svgCompanies } />
      <ContactForm />
    </div>
  );
}