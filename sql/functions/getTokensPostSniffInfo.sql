select 
    tokens.token_name, 
    tokens.contract_hash, 
    tokens.uuid, 
    tokens_post_sniff.token_uuid 
from tokens_post_sniff 
left join tokens 
on tokens_post_sniff.token_uuid = tokens.uuid;