module LandingHelper
  def landing_text(key)
    I18n.t("public_landing.#{key}", locale: :en)
  end

  def landing_whatsapp_url
    phone_number = ENV.fetch('SINGABANA_WHATSAPP_NUMBER', '628218713326').to_s.strip
    phone_number = phone_number.delete_prefix('+')
    phone_number = "62#{phone_number[1..]}" if phone_number.start_with?('0')

    unless phone_number.match?(/\A[1-9]\d{7,14}\z/)
      raise ArgumentError, 'SINGABANA_WHATSAPP_NUMBER must contain an international phone number with digits only'
    end

    "https://wa.me/#{phone_number}?text=#{ERB::Util.url_encode(landing_text('whatsapp_message'))}"
  end
end
