import { MapPin, Phone, Mail } from 'lucide-react';

/**
 * FooterContact Component
 * Section informasi kontak dengan icon dan detail alamat.
 * 
 * @param {Object} contactInfo - Object berisi address, phone, dan email (optional)
 */
const FooterContact = ({
  contactInfo = {
    address: {
      line1: "Kampus Sindangsari,",
      line2: "Jl. Raya Pabuaran,",
      line3: "Kab. Serang, Banten 42163"
    },
    phone: "+62 254 280330",
    email: "helpdesk@untirta.ac.id"
  }
}) => (
  <ul className="space-y-4">
    {/* Address */}
    <li className="flex items-start gap-3">
      <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
      <span>
        {contactInfo.address.line1}<br />
        {contactInfo.address.line2}<br />
        {contactInfo.address.line3}
      </span>
    </li>

    {/* Phone */}
    <li className="flex items-center gap-3">
      <Phone className="w-5 h-5 text-blue-500 shrink-0" />
      <span className="hover:text-white cursor-pointer">{contactInfo.phone}</span>
    </li>

    {/* Email */}
    <li className="flex items-center gap-3">
      <Mail className="w-5 h-5 text-blue-500 shrink-0" />
      <span className="hover:text-white cursor-pointer">{contactInfo.email}</span>
    </li>
  </ul>
);

export default FooterContact;
