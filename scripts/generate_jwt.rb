require 'openssl'
require 'jwt'  # https://rubygems.org/gems/jwt

# Private key contents
private_pem = """-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAsn3MVjQSy9WwLS09GdLAHFMfH9VOZBE8R/ghB81J+CGwx9MQ
+LAVulV2y/mnMBIdnOKotBWaQHD7QFt7tez56THhh1k0Es5v2wvBHd1jFdmWXEvh
nm/LmT3woWy+1+r6gh4Lci4ZXX7T+y15xzzThwTrbLqTq0qLK0RAiz0jxnSOFFma
JiyE22ub4LbR2XQ1Y0rAlyV4995f6bxLbNNJWnbLo1w5aU8swzsLzAiOuNynZyB4
Ch99MPcJXIE9ECKBglF3MY6ndY1rjmOKza6lEhMh8iVpQewhkjIoRJGzCH9mM4Ft
rtPD2f/YSH2+xF95umXcOANeP9mkKbvCWJ2a3QIDAQABAoIBAQCCEeYsE3p3C9t8
sHDMNqZEfdY6jmi3x0+Uap83XkQ/C94VYBwH/dl3lfwiHGXXQ/xMbWffA7cKqsqN
VZ1LL8vWQcFFrp2h7snYaDJsnv4r2AoYbDuYB4Powhhuqh5Qni27UEWrCSj21wuH
CNareAn1ZIJjE3u04XeVKgGW9hDx9plTRfp2xny1WHhfX4CxgJDj93r+/z0RygAE
hUku7IuMZ4k4vR7+HfizE6yX+dJE87PTd+VykA2Vpe9kcoYgPtTwRZyXDStzaWwy
G1kGKzODA/UrD3tipj67w3kTpDKmyUtfkWujV73Re0PXUWUhU0J2qAYAg6dZTYtb
3r6BCf2JAoGBAOf/r7iO7LknywbDo1sOFC+mCroUxHn0Tgn2/rLItlVw2hyL61vt
hh2qZG4j6g8OdtXxvkeaxSYh69dKLSXXt+5p1MxRcJmsUyYXd5uBtiSaUaPLERBX
VMI8UHbkuL/4p4Rk+XdGT5sJGifQAXy7W/xTPdej/TtLPZRMM+chVdcLAoGBAMT1
AlFcaKe2jvWJWx73Beml63oIfmnXIaU24p3Ra5jxMk3lZQ1owvyWYvvkyRMf+5Jc
X6S7GPFilQa5xps4br/TySI8goPW5w8qqCm87EgsEgacd8TUlWnwLwyPEL0Oba6J
IbOtrc2eeM16T98s9UZ7LhUQVSClOog1YuvjR+a3AoGAHms/DhLnZQubqkJim+DH
ssuxol5wuJDY3qOdF7ILfj5yysVp0b7eE+uwiWR6HwlFeZ3d1iOr7+kItEzMiKa1
PjRwK24ONogKyvbOvvwN9tSpGbHZhev9eA5SepRYyQsAY/KdZw84Btr1q/yxBTrH
v9jmRe0BmhGufFBVidusFqsCgYBgzNJQzowZMZ5dix6fv2TGiueK2LXYqwU8QBds
3Up2psTEiCP8TSrYHcmUZ8NzhNqN+px/R/1gVcVMwu2byEaWPS6zhu3Wgj6Zs6tm
qBWw+wf4+9nZgWnV4VgeYgomAPtjNr67onazgll5E85Br8T02QGzFI3iN5Lm8uYl
bVUfTQKBgQDe/I3CZgkZN5lm3cuJRqFscrzQTlDrcZBF/+grp6OdtZ7aihI4086J
pbekeqii3xtTQjQ7IgAgGEscSeHpYTfFeF25cn8XuafvwhJK+lOCb5nXsyKWjY4D
xZTCByKJbFrYd3sjjlEvXLzvphX2YIDQfjKyG2VhSeTlbOPv27fgsw==
-----END RSA PRIVATE KEY-----"""

private_key = OpenSSL::PKey::RSA.new(private_pem)

# Generate the JWT
payload = {
  # issued at time, 60 seconds in the past to allow for clock drift
  iat: Time.now.to_i - 60,
  # JWT expiration time (10 minute maximum)
  exp: Time.now.to_i + (10 * 60),

  iss: 222164
}

jwt = JWT.encode(payload, private_key, "RS256")
puts jwt
