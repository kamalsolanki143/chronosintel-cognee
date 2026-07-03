import json
import os

def load_json(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def parse_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_case_dir = os.path.join(base_dir, 'sample_case')
    updated_evidence_dir = os.path.join(base_dir, 'updated_evidence')
    
    parsed_output = []
    parsed_output.append("=== PHASE 1: INITIAL INCIDENT ===")

    # --- PARSE INITIAL SAMPLE CASE ---
    email_file = os.path.join(sample_case_dir, 'emails', 'leak_thread.json')
    if os.path.exists(email_file):
        for e in load_json(email_file):
            parsed_output.append(f"[EMAIL] {e['timestamp']} | From: {e['sender']} | Subj: {e['subject']} | Body: {e['body']}")

    chat_file = os.path.join(sample_case_dir, 'chats', 'it_slack.json')
    if os.path.exists(chat_file):
        for c in load_json(chat_file):
            parsed_output.append(f"[CHAT] {c['timestamp']} | User: {c['user']} | Msg: {c['message']}")

    audit_file = os.path.join(sample_case_dir, 'audit_logs', 'firewall_egress.json')
    if os.path.exists(audit_file):
        for a in load_json(audit_file):
            parsed_output.append(f"[AUDIT] {a['timestamp']} | Event: {a['event_type']} | Size: {a['data_size_gb']}GB")

    git_file = os.path.join(sample_case_dir, 'git_logs', 'repo_access.json')
    if os.path.exists(git_file):
        for g in load_json(git_file):
            parsed_output.append(f"[GIT] {g['timestamp']} | User: {g['user']} | Action: {g['action']}")

    meeting_file = os.path.join(sample_case_dir, 'meetings', 'incident_response.json')
    if os.path.exists(meeting_file):
        for m in load_json(meeting_file):
            for t in m['transcript']:
                parsed_output.append(f"[MEETING] {m['date']} | Speaker: {t['speaker']} | Stated: {t['text']}")

    doc_file = os.path.join(sample_case_dir, 'documents', 'nova_readme.txt')
    if os.path.exists(doc_file):
        with open(doc_file, 'r') as f:
            parsed_output.append(f"[DOCUMENT] Content: {f.read().strip()}")

    # --- PARSE UPDATED EVIDENCE ---
    parsed_output.append("\n=== PHASE 2: NEW EVIDENCE DISCOVERED ===")
    
    new_email_file = os.path.join(updated_evidence_dir, 'new_email', 'cover_up.json')
    if os.path.exists(new_email_file):
        for e in load_json(new_email_file):
            parsed_output.append(f"[UPDATE-EMAIL] {e['timestamp']} | From: {e['sender']} | Body: {e['body']}")

    audit_update_file = os.path.join(updated_evidence_dir, 'audit_update', 'secondary_breach.json')
    if os.path.exists(audit_update_file):
        for a in load_json(audit_update_file):
            parsed_output.append(f"[UPDATE-AUDIT] {a['timestamp']} | Event: {a['event_type']} | Details: {a['details']}")

    witness_file = os.path.join(updated_evidence_dir, 'witness_statement', 'sarah_statement.txt')
    if os.path.exists(witness_file):
        with open(witness_file, 'r') as f:
            parsed_output.append(f"[UPDATE-WITNESS] Content: {f.read().strip()}")

    forensic_file = os.path.join(updated_evidence_dir, 'forensic_report', 'laptop_analysis.txt')
    if os.path.exists(forensic_file):
        with open(forensic_file, 'r') as f:
            parsed_output.append(f"[UPDATE-FORENSICS] Content: {f.read().strip()}")

    # --- SAVE FINAL FILE ---
    output_filepath = os.path.join(base_dir, 'master_cognee_ingestion.txt')
    with open(output_filepath, 'w') as f:
        f.write("\n".join(parsed_output))
        
    print(f"SUCCESS: Processed BOTH phases! Data saved to {output_filepath}")

if __name__ == "__main__":
    parse_data()
