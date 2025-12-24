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
      line1: "Gedung D, Kemendikbud Ristek,",
      line2: "Jl. Jenderal Sudirman, Senayan,",
      line3: "Jakarta Pusat 10270"
    },
    phone: "+62 21 5794 6104",
    email: "sekretariat@spada.id"
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
