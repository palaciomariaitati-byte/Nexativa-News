"""
scripts/setup_oci_infrastructure.py
Configuración de Red (VCN, Internet Gateway, Security List, Subnet) y Auto-Provisioner de Nora AI en Oracle Cloud.
"""
import os
import sys
import time
import oci
from cryptography.hazmat.primitives import serialization

# Asegurar compatibilidad UTF-8 en terminales Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import functools
print = functools.partial(print, flush=True)

CONFIG = {
    "user": "ocid1.user.oc1..aaaaaaaabzu5buk62c3bdmsurhuysyfewzp3ipxuwyj4lae2ydfafnipq2vq",
    "key_file": r"D:\Biblioteca\Escritorio\Api KEY ORACLE\palaciomariaitati@gmail.com-2026-08-13T23_44_32.996Z.pem",
    "fingerprint": "a3:4c:9a:e8:80:f0:c0:db:ce:f0:b5:0d:c5:97:62:2d",
    "tenancy": "ocid1.tenancy.oc1..aaaaaaaagxqypmgk5w2br47qkd72mrbomahhhrufnt6pp3ikkfh4sa5725qa",
    "region": "sa-vinhedo-1"
}

def get_or_create_network(network_client, tenancy_id):
    print("🌐 [RED] Verificando Virtual Cloud Network (VCN)...")
    vcns = network_client.list_vcns(tenancy_id).data
    
    vcn_id = None
    if vcns:
        vcn = vcns[0]
        vcn_id = vcn.id
        print(f"✅ VCN existente encontrada: {vcn.display_name} ({vcn_id})")
    else:
        print("🚀 Creando nueva VCN para Nora AI...")
        vcn_details = oci.core.models.CreateVcnDetails(
            cidr_block="10.0.0.0/16",
            display_name="vcn-nora-ai",
            compartment_id=tenancy_id,
            dns_label="noraai"
        )
        vcn = network_client.create_vcn(vcn_details).data
        vcn_id = vcn.id
        time.sleep(5)
        print(f"✅ VCN creada con éxito: {vcn_id}")

    # Internet Gateway
    igws = network_client.list_internet_gateways(tenancy_id, vcn_id=vcn_id).data
    igw_id = None
    if igws:
        igw_id = igws[0].id
        print(f"✅ Internet Gateway existente: {igw_id}")
    else:
        print("🚀 Creando Internet Gateway...")
        igw_details = oci.core.models.CreateInternetGatewayDetails(
            compartment_id=tenancy_id,
            vcn_id=vcn_id,
            display_name="igw-nora-ai",
            is_enabled=True
        )
        igw = network_client.create_internet_gateway(igw_details).data
        igw_id = igw.id
        time.sleep(3)
        print(f"✅ Internet Gateway creado: {igw_id}")

    # Route Table: ruta hacia internet (0.0.0.0/0)
    vcn = network_client.get_vcn(vcn_id).data
    rt_id = vcn.default_route_table_id
    route_rules = [
        oci.core.models.RouteRule(
            destination="0.0.0.0/0",
            destination_type="CIDR_BLOCK",
            network_entity_id=igw_id
        )
    ]
    network_client.update_route_table(
        rt_id,
        oci.core.models.UpdateRouteTableDetails(route_rules=route_rules)
    )
    print("✅ Tabla de Enrutamiento configurada para acceso público a Internet.")

    # Security List: abrir puertos 22 (SSH), 80, 443, 11434 (Ollama), 5678 (n8n)
    sl_id = vcn.default_security_list_id
    ingress_rules = [
        oci.core.models.IngressSecurityRule(
            protocol="6", # TCP
            source="0.0.0.0/0",
            tcp_options=oci.core.models.TcpOptions(
                destination_port_range=oci.core.models.PortRange(min=22, max=22)
            ),
            description="SSH"
        ),
        oci.core.models.IngressSecurityRule(
            protocol="6",
            source="0.0.0.0/0",
            tcp_options=oci.core.models.TcpOptions(
                destination_port_range=oci.core.models.PortRange(min=80, max=80)
            ),
            description="HTTP"
        ),
        oci.core.models.IngressSecurityRule(
            protocol="6",
            source="0.0.0.0/0",
            tcp_options=oci.core.models.TcpOptions(
                destination_port_range=oci.core.models.PortRange(min=443, max=443)
            ),
            description="HTTPS"
        ),
        oci.core.models.IngressSecurityRule(
            protocol="6",
            source="0.0.0.0/0",
            tcp_options=oci.core.models.TcpOptions(
                destination_port_range=oci.core.models.PortRange(min=11434, max=11434)
            ),
            description="Ollama Engine"
        ),
        oci.core.models.IngressSecurityRule(
            protocol="6",
            source="0.0.0.0/0",
            tcp_options=oci.core.models.TcpOptions(
                destination_port_range=oci.core.models.PortRange(min=5678, max=5678)
            ),
            description="n8n Workflows"
        )
    ]
    network_client.update_security_list(
        sl_id,
        oci.core.models.UpdateSecurityListDetails(ingress_security_rules=ingress_rules)
    )
    print("✅ Reglas de Firewall (Security List) configuradas para Nora AI.")

    # Subnet
    subnets = network_client.list_subnets(tenancy_id, vcn_id=vcn_id).data
    subnet_id = None
    if subnets:
        subnet_id = subnets[0].id
        print(f"✅ Subnet existente: {subnets[0].display_name} ({subnet_id})")
    else:
        print("🚀 Creando Subnet pública...")
        subnet_details = oci.core.models.CreateSubnetDetails(
            compartment_id=tenancy_id,
            vcn_id=vcn_id,
            cidr_block="10.0.0.0/24",
            display_name="subnet-nora-public",
            dns_label="norasubnet",
            route_table_id=rt_id,
            security_list_ids=[sl_id]
        )
        subnet = network_client.create_subnet(subnet_details).data
        subnet_id = subnet.id
        time.sleep(5)
        print(f"✅ Subnet pública creada: {subnet_id}")

    return subnet_id

def get_ssh_public_key():
    key_path = r"D:\Proyectos\claves-nora\ssh-key-nora.key"
    with open(key_path, "rb") as f:
        key_data = f.read()
    
    private_key = serialization.load_pem_private_key(key_data, password=None)
    public_key = private_key.public_key()
    ssh_pub = public_key.public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH
    ).decode("utf-8")
    return ssh_pub

def run_auto_provisioner():
    print("=" * 60)
    print("🤖 NORA AI - AUTO-PROVISIONER EN ORACLE CLOUD (OCI)")
    print("=" * 60)

    identity_client = oci.identity.IdentityClient(CONFIG)
    compute_client = oci.core.ComputeClient(CONFIG)
    network_client = oci.core.VirtualNetworkClient(CONFIG)

    tenancy_id = CONFIG["tenancy"]

    # 1. Configurar o verificar red
    subnet_id = get_or_create_network(network_client, tenancy_id)

    # 2. Obtener Availability Domain
    ads = identity_client.list_availability_domains(tenancy_id).data
    ad_name = ads[0].name
    print(f"📍 Availability Domain: {ad_name}")

    # 3. Obtener Imagen Ubuntu 24.04 ARM
    images = compute_client.list_images(
        tenancy_id,
        operating_system="Canonical Ubuntu",
        shape="VM.Standard.A1.Flex"
    ).data
    
    image_id = None
    for img in images:
        if "24.04" in img.display_name or "22.04" in img.display_name:
            image_id = img.id
            print(f"📀 Imagen Seleccionada: {img.display_name} ({image_id})")
            break
    
    if not image_id and images:
        image_id = images[0].id

    # 4. SSH Public Key
    ssh_key = get_ssh_public_key()
    print("🔑 Clave SSH vinculada correctamente.")

    # Configuraciones Always Free con 100 GB de Disco Boot Volume
    CONFIGURATIONS = [
        {"name": "4 OCPUs | 24 GB RAM | 100 GB SSD (Full Máxima Potencia)", "ocpus": 4.0, "ram": 24.0},
        {"name": "2 OCPUs | 24 GB RAM | 100 GB SSD (Máxima Memoria 24GB)", "ocpus": 2.0, "ram": 24.0},
        {"name": "2 OCPUs | 12 GB RAM | 100 GB SSD (Intermedia Ágil)", "ocpus": 2.0, "ram": 12.0},
    ]

    print("\n🚀 INICIANDO DEMONIO CON ROTACIÓN INTELIGENTE DE HARDWARE...")
    print("Capacidad de Disco fijada: 100 GB SSD Boot Volume")
    print("Rotando entre las mejores configuraciones Always Free para máxima probabilidad de captura...\n")

    attempt = 0
    while True:
        for cfg in CONFIGURATIONS:
            attempt += 1
            current_time = time.strftime("%H:%M:%S")
            print(f"[{current_time}] [Intento #{attempt}] Probando: {cfg['name']}...")

            instance_details = oci.core.models.LaunchInstanceDetails(
                display_name="srv-nora-ai-core",
                compartment_id=tenancy_id,
                availability_domain=ad_name,
                shape="VM.Standard.A1.Flex",
                shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(
                    ocpus=cfg["ocpus"],
                    memory_in_gbs=cfg["ram"]
                ),
                source_details=oci.core.models.InstanceSourceViaImageDetails(
                    image_id=image_id,
                    boot_volume_size_in_gbs=100
                ),
                create_vnic_details=oci.core.models.CreateVnicDetails(
                    subnet_id=subnet_id,
                    assign_public_ip=True,
                    display_name="vnic-nora-ai"
                ),
                metadata={
                    "ssh_authorized_keys": ssh_key
                }
            )

            try:
                instance = compute_client.launch_instance(instance_details).data
                print("\n" + "🎉" * 20)
                print(f"🎉 ¡INSTANCIA APROVISIONADA CON ÉXITO POR ORACLE CLOUD!")
                print(f"Configuración lograda: {cfg['name']}")
                print(f"Instance ID: {instance.id}")
                print(f"Estado Inicial: {instance.lifecycle_state}")
                print("🎉" * 20 + "\n")

                # Esperar a que pase a RUNNING y obtener IP
                print("⏳ Esperando que el servidor pase a estado RUNNING y asigne IP Pública...")
                while True:
                    time.sleep(10)
                    inst_status = compute_client.get_instance(instance.id).data
                    print(f"Estado actual: {inst_status.lifecycle_state}")
                    if inst_status.lifecycle_state == "RUNNING":
                        vnics = compute_client.list_vnic_attachments(tenancy_id, instance_id=instance.id).data
                        if vnics:
                            vnic = network_client.get_vnic(vnics[0].vnic_id).data
                            print(f"\n🌟 IP PÚBLICA DEL SERVIDOR: {vnic.public_ip}")
                            with open("D:/Proyectos/claves-nora/server_ip.txt", "w") as f_ip:
                                f_ip.write(vnic.public_ip)
                        break

                print("\n✅ Nora AI Server está 100% listo en la nube.")
                return

            except oci.exceptions.ServiceError as e:
                if "Out of host capacity" in str(e.message) or e.status == 500:
                    print(f"   ⏳ Datacenter lleno para {cfg['ocpus']} OCPUs / {cfg['ram']} GB RAM. Rotando en 30s...")
                elif e.status == 429:
                    print(f"   ⏳ Oracle pide enfriar peticiones (429). Esperando 45s...")
                    time.sleep(15)
                elif "LimitExceeded" in str(e.message):
                    print(f"   ⚠️ Límite de recursos alcanzado: {e.message}")
                    return
                else:
                    print(f"   ⚠️ Mensaje de Oracle ({e.status}): {e.message}")
                
                time.sleep(30)

            except Exception as ex:
                print(f"   ⚠️ Error de conexión: {ex}")
                time.sleep(30)

if __name__ == "__main__":
    run_auto_provisioner()
